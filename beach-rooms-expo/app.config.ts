import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'beach-rooms-expo',
  slug: config.slug ?? 'beach-rooms-expo',
});
