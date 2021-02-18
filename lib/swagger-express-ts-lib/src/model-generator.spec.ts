import { interfacePropertyToModelProperty, parseProperty, sanitize } from './model-generator';
import chai from 'chai';

const expect = chai.expect;

describe('model generator', () => {
  describe('sanitizes', () => {
    it('santitizes _links: {', () => {
      const res = sanitize('_links: {');
      expect(res).to.equal('_links: {');
    });

    it('sanitizes [key: string]: value', () => {
      const res = sanitize('[key: string]: value');
      expect(res).to.equal('key: value');
    });
  });

  describe('interfacePropertyToModelProperty', () => {
    it('IHalRes _links: {', async () => {
      const model = await interfacePropertyToModelProperty('IHalRes', '_links: {', []);

      expect(model).to.eql({
        'description': '_links',
        'required': true,
        'type': 'object',
      });
    });

    it('parses _links: {', () => {
      const [lhs, rhs] = parseProperty('_links: {');
      expect(lhs).to.equal('_links');
      expect(rhs).to.equal('{');
    });

    it('[key: string]: TestItem', async () => {
      const model = await interfacePropertyToModelProperty('DictionaryType', '[key: string]: TestItem', []);
      expect(model).to.eql({
        'description': 'key',
        'model': 'TestItem',
        'required': true,
        'type': 'object',
      });
    });
  });
});
