import type { ConfigContext, ExpoConfig } from 'expo/config';

// Release builds get the git tag (e.g. "v1.2.3") via APP_VERSION from the
// EAS workflow. Everywhere else the version from app.json is used.
function versionFromTag(tag: string | undefined): string | undefined {
  if (!tag) return undefined;
  const version = tag.replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`APP_VERSION "${tag}" is not a version tag like v1.2.3`);
  }
  return version;
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  version: versionFromTag(process.env.APP_VERSION) ?? config.version,
});
