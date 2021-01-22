import 'reflect-metadata';
import { controller, httpPost, requestBody } from 'inversify-express-utils';
import {
  ApiModel,
  ApiModelProperty,
  ApiOperationPost,
  ApiPath,
  SwaggerDefinitionConstant,
} from '../lib/swagger-express-ts-lib/src';

@ApiPath({
  path: '/test',
  name: 'Test',
})
@controller('/test')
export class TestController {
  @ApiOperationPost({
    description: 'Test controller',
    summary: 'Test controller',
    path: '/post',
    parameters: {
      body: {
        model: 'TestItem',
        type: SwaggerDefinitionConstant.ARRAY,
      },
    },
    responses: {
      200: { description: 'success', model: 'HalRes' },
    },
  })
  @httpPost('/post')
  public async post(@requestBody() testItems: TestItem[]) {
    return `hello, world! length = ${testItems.length}`;
  }
}

// tslint:disable-next-line:max-classes-per-file
@ApiModel({
  name: 'Test Item',
})
export class TestItem {
  @ApiModelProperty({
    type: SwaggerDefinitionConstant.STRING,
  })
  public field1!: string;

  @ApiModelProperty({
    type: SwaggerDefinitionConstant.STRING,
  })
  public field2!: string;
}

// tslint:disable-next-line:max-classes-per-file
@ApiModel({
  name: 'Hal Response',
})
export class HalRes {
  @ApiModelProperty({
    type: SwaggerDefinitionConstant.OBJECT,
  })
  // tslint:disable-next-line:variable-name
  public _links!: {};

  @ApiModelProperty({
    type: SwaggerDefinitionConstant.STRING,
  })
  public field1!: string;
}
