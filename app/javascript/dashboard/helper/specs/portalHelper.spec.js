import { buildPortalArticleURL, buildPortalURL } from '../portalHelper';

describe('PortalHelper', () => {
  describe('buildPortalURL', () => {
    it('returns the correct url', () => {
      window.chatwootConfig = {
        hostURL: 'https://app.ahmedkhaled4d.com',
        helpCenterURL: 'https://help.ahmedkhaled4d.com',
      };
      expect(buildPortalURL('handbook')).toEqual(
        'https://help.ahmedkhaled4d.com/hc/handbook'
      );
      window.chatwootConfig = {};
    });
  });

  describe('buildPortalArticleURL', () => {
    it('returns the correct url', () => {
      window.chatwootConfig = {
        hostURL: 'https://app.ahmedkhaled4d.com',
        helpCenterURL: 'https://help.ahmedkhaled4d.com',
      };
      expect(
        buildPortalArticleURL('handbook', 'culture', 'fr', 'article-slug')
      ).toEqual('https://help.ahmedkhaled4d.com/hc/handbook/articles/article-slug');
      window.chatwootConfig = {};
    });
  });
});
