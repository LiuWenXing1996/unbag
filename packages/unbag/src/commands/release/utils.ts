export const resolvePresetPath = (
  preset: string = "conventional-changelog-conventionalcommits"
) => {
  const presetPath = require.resolve(preset);
  return presetPath;
};
