import { SwaggerService } from './swagger.service';
import { IApiOperationArgsBase } from './i-api-operation-args.base';

const fs = require('fs');
const exec = require('await-exec');
const _ = require('lodash');

const modelNames: string[] = [];
const modelNamesGenerated: string [] = [];
const models = SwaggerService.getInstance().getData().definitions;

export function addModel(args: IApiOperationArgsBase) {
  const successfulResponseModelName = args && args.responses && args.responses[200] && args.responses[200].model;
  const bodyModelName = args && args.parameters && args.parameters.body && args.parameters.body.model;

  if (successfulResponseModelName) {
    modelNames.push(successfulResponseModelName);
  }

  if (bodyModelName) {
    modelNames.push(bodyModelName);
  }
}

export const generateModelsOnlyOnce = _.memoize(generateModels);

export async function generateModels(interfaceScanPaths: string[]) {
  const modelNamesToGenerate = modelNames.filter((elem, index, self) => index === self.indexOf(elem));
  const promises = modelNamesToGenerate.map((name) => generateModelWithChildModels(name, interfaceScanPaths));
  await Promise.all(promises);

  SwaggerService.getInstance().setDefinitions(models);
}

async function generateModelWithChildModels(modelName: any, interfaceScanPaths: string[]) {
  const interfaceProperties = await getInterfaceProperties(modelName, interfaceScanPaths);
  await interfaceToModel(modelName, interfaceProperties, interfaceScanPaths);
}

async function getInterfaceProperties(interfaceName: string, interfaceScanPaths: string[]) {
  const path = await findFileInterfaceOnlyOnce(interfaceName, interfaceScanPaths);
  return path ? getPropertiesFromFileOnlyOnce(path, interfaceName, interfaceScanPaths) : [];
}

const findFileInterfaceOnlyOnce = _.memoize(findFileInterface);

async function findFileInterface(interfaceName: string, interfaceScanPaths: string[]) {
  for (const path of interfaceScanPaths) {
    const grep = `grep -r "export interface ${interfaceName} " ${path}`;
    if (fs.existsSync(path)) {
      try {
        const grepResponse = await exec(grep);
        const output = grepResponse.stdout as string;
        if (!output) {
          continue;
        }
        const file = output.split(':')[0];
        if (file) {
          return file;
        }
      } catch (err) {
        // console.warn(err);
        // console.log('GREP FAILED: ', interfaceName, path);
        continue;
      }
    }
  }
  return undefined;
}

const getPropertiesFromFileOnlyOnce = _.memoize(getPropertiesFromFile, (path: string, interfaceName: string) => `${path}|${interfaceName}`);

async function getPropertiesFromFile(path: string, interfaceName: string, interfaceScanPaths: string[]) {
  const replace = `export interface ${interfaceName} [^]*}`;
  const regex = new RegExp(replace, 'g');
  const file = fs.readFileSync(path, 'utf8');

  const interfaceObj = file.match(regex)[0].split('}')[0];
  let interfaceProperties = interfaceObj.split('\n');
  const header = interfaceProperties.shift();

  interfaceProperties = interfaceProperties.map((property: any) => property.replace('\t', ''));
  interfaceProperties = interfaceProperties.filter((property: any) => property);

  const extendsOtherInterface = header.includes('extends');

  if (extendsOtherInterface) {
    const parentInterface = header.split('extends')[1].split('{')[0].trim();
    const parentProperties = await getInterfaceProperties(parentInterface, interfaceScanPaths);
    interfaceProperties = interfaceProperties.concat(parentProperties);
  }

  return interfaceProperties;
}

async function interfaceToModel(interfaceName: string, interfaceProperties: any, interfaceScanPaths: string[]) {
  models[interfaceName] = { properties: {}, type: '' };
  for (const property of interfaceProperties) {
    await interfacePropertyToModelProperty(interfaceName, property, interfaceScanPaths);
  }
  return;
}

export function sanitize(interfaceProperty: any) {
  return interfaceProperty.replace(';', '').split('//')[0].trim().replace(/^\[/, '').replace(/:\s*\w+\s*]\s*:/, ':');
}

export function parseProperty(interfaceProperty: any) {
  const split = interfaceProperty.split(':');
  const lhs = split[0];
  const rhs = split[1].trim();

  return [lhs, rhs];
}

export function getPropertyType(propertyRightSide: string) {
  const arrayRemoved = propertyRightSide.replace('[]', '').replace('Array<', '').replace('>', '');
  const [firstType] = arrayRemoved.split('| undefined');
  return firstType.trim();
}

export async function interfacePropertyToModelProperty(interfaceName: string, interfaceProperty: any, interfaceScanPaths: string[]) {
  try {
    interfaceProperty = sanitize(interfaceProperty);
    const [propertyLeftSide, propertyRightSide] = parseProperty(interfaceProperty);

    const propertyName = propertyLeftSide.replace('?', '');
    const isOptional = propertyLeftSide.indexOf('?') >= 0 || propertyRightSide.indexOf('| undefined') >= 0;
    const propertyType = getPropertyType(propertyRightSide);
    const isArray = propertyRightSide.indexOf('[]') >= 0 || propertyRightSide.indexOf('Array<') >= 0;
    const isIndexedObject = propertyLeftSide.indexOf('[') >= 0;
    const isAny = propertyType.toLowerCase().indexOf('any') >= 0 || propertyType.toLowerCase().indexOf('{') >= 0;

    const model: any = {
      description: propertyName,
      required: !isOptional,
      type: propertyType,
    };

    const isPrimitive = isPropertyPrimitive(model);

    if (!isPrimitive && !isIndexedObject && !isAny) {
      if (!models[model.type]) {
        if (modelNamesGenerated.indexOf(model.type) === -1) {
          modelNamesGenerated.push(model.type);

          const properties = await getInterfaceProperties(model.type, interfaceScanPaths);
          await interfaceToModel(model.type, properties, interfaceScanPaths);
        }
      }

      model.model = model.type;
      model.type = 'object';

    } else {
      if (model.type === 'Date') {
        model.type = 'string';
        model.format = 'date';
      }
    }

    if (isArray) {
      model.itemType = isAny ? 'object' : model.type;
      model.type = 'array';
    }

    if (isAny) {
      model.type = 'object';
    }

    if (isIndexedObject) {
      models[interfaceName].type = 'object';
    } else if (models[interfaceName] && models[interfaceName].properties) {
      models[interfaceName].properties[model.description] = model;
    }

    return model;

  } catch (e) {
    // intentionally
  }
}

function isPropertyPrimitive(modelPropery: any) {
  const primitives = ['string', 'integer', 'number', 'boolean', 'Date'];
  return primitives.includes(modelPropery.type);
}
