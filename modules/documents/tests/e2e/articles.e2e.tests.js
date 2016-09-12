'use strict';

describe('Documents E2E Tests:', function () {
  describe('Test documents page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/documents');
      expect(element.all(by.repeater('document in documents')).count()).toEqual(0);
    });
  });
});
