import { getLogo, getSystemName } from './utils';

describe('branding defaults', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('uses FrameBridge defaults before server status is loaded', () => {
    expect(getSystemName()).toBe('帧桥 API');
    expect(getLogo()).toBe('/logo.svg');
  });
});
