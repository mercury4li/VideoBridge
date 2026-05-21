import en from './en/translation.json';
import zh from './zh/translation.json';
import fs from 'fs';
import path from 'path';

const visibleBrandingText = [
  zh.home.welcome.description,
  zh.home.system_status.info.source_link,
  zh.about.description,
  zh.about.repository,
  zh.footer.built_by,
  zh.footer.built_by_name,
  zh.setting.personal.general.system_token_notice,
  en.home.welcome.description,
  en.home.system_status.info.source_link,
  en.about.description,
  en.about.repository,
  en.footer.built_by,
  en.footer.built_by_name,
  en.setting.personal.general.system_token_notice,
];

describe('public branding copy', () => {
  test('does not expose upstream One API branding in user-facing copy', () => {
    for (const text of visibleBrandingText) {
      expect(text).not.toMatch(/One API|OpenAI related/i);
    }
  });

  test('does not ship upstream project labels in frontend source', () => {
    const root = path.resolve(__dirname, '..');
    const files = [];

    const collect = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collect(fullPath);
        } else if (!entry.name.endsWith('.test.js')) {
          files.push(fullPath);
        }
      }
    };

    collect(root);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(`${file}\n${content}`).not.toMatch(/One API|songquanpeng\/one-api/);
    }
  });
});
