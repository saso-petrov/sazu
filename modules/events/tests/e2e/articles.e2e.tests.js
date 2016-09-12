'use strict';

describe('Events E2E Tests:', function () {
  describe('Test events page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/events');
      expect(element.all(by.repeater('event in events')).count()).toEqual(0);
    });
  });
});
