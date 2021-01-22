import 'reflect-metadata';
import { stopServer } from './helpers';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import * as swagger from '../lib/swagger-express-ts-lib/src';
import './test-controller';
import { agent as request } from 'supertest';

jest.setTimeout(20000);
describe('swagger e2e', () => {
  beforeAll(stopServer);
  afterAll(stopServer);

  let app: any;
  beforeAll(() => {
    const container = new Container();

    const expressServer = new InversifyExpressServer(container);
    expressServer.setConfig((app) => {
      app.use(swagger.express({
        definition: { info: { title: 'test', version: '1.0.0' } },
        interfaceScanPaths: [__dirname],
      }));
    });
    app = expressServer.build();
  });

  it('serves swagger', async () => {
    expect(app).toBeDefined();

    const res = await request(app).get('/api-docs/swagger.json').send();
    expect(res.status).toEqual(200);
    expect(res.body.definitions['Test Item']).toBeDefined();
    expect(res.body.definitions.IHalRes).toBeDefined();
  });
});
