import { ReleaseChangelogFileContent, ReleaseConfig } from ".";
import { FinalUserConfig } from "../../utils/config";
import { resolvePresetPath } from "./utils";

function streamToString(stream) {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

const ChangelogHeaderDividerTag =
  "\n\n[comment]: # (!!!ChangelogHeaderDividerTag!!!)\n\n";
const ChangelogFooterDividerTag =
  "\n\n[comment]: # (!!!ChangelogFooterDividerTag!!!)\n\n";

export const changelogContentParser = (
  content: string
): ReleaseChangelogFileContent => {
  const result: ReleaseChangelogFileContent = {};
  const headerIndex = content.indexOf(ChangelogHeaderDividerTag);
  const footerIndex = content.indexOf(ChangelogFooterDividerTag);
  // FIXME:这个地方的解析有问题，会出现‘ag!!!)’乱码
  if (headerIndex > -1) {
    result.header = content.substring(0, ChangelogHeaderDividerTag.length);
  }
  result.body = content.substring(
    headerIndex > -1 ? ChangelogHeaderDividerTag.length : 0,
    footerIndex > -1 ? footerIndex : undefined
  );
  if (footerIndex > -1) {
    result.footer = content.substring(ChangelogFooterDividerTag.length);
  }
  return result;
};

export const changelogContentStringify = (
  content: ReleaseChangelogFileContent
) => {
  const { body, header, footer } = content;
  return (
    "" +
    (header || "") +
    ChangelogHeaderDividerTag +
    (body || "") +
    ChangelogFooterDividerTag +
    (footer || "")
  );
};

export const changelog = async (config: FinalUserConfig) => {
  const { release } = config;
  const {
    readChangelogFile,
    disableWriteChangelogFile,
    writeChangelogFile,
    changelogHeader,
    changelogFooter,
  } = release;
  const conventionalChangelog = await import("conventional-changelog");
  // TODO：此处需要过滤 scope
  const conventionalChangelogStream = conventionalChangelog.default({
    preset: resolvePresetPath(),
  });
  const newChangeset = await streamToString(conventionalChangelogStream);
  const oldContent = await readChangelogFile?.(config);
  const newContent: ReleaseChangelogFileContent = {
    header: changelogHeader,
    footer: changelogFooter,
    body: "" + newChangeset + "\n" + (oldContent?.body || ""),
  };
  if (!disableWriteChangelogFile) {
    await writeChangelogFile?.(config, newContent);
  }
  return newContent;
};
