/**
 * Editor field presets shared by the modern blocks' fields.ts files, so every
 * block offers the same tone/spacing/API options with the same labels.
 */
import { createField } from "vue-wswg-editor";
import { MOCKUP_STATS, TONE_OPTIONS } from "./pb";
import UploadField from "../page-builder/fields/UploadField.vue";

/** Section background tone. */
export const toneField = (fallback = "light") =>
  createField.select(TONE_OPTIONS, { label: "Background", default: fallback, group: "Style" });

/** Vertical padding of the section. */
export const spaceField = (fallback = "md") =>
  createField.select(
    [
      { label: "Compact", value: "sm", id: "sp-sm" },
      { label: "Normal", value: "md", id: "sp-md" },
      { label: "Spacious", value: "lg", id: "sp-lg" },
    ],
    { label: "Spacing", default: fallback, group: "Style" }
  );

/** Left / centre alignment for a section heading. */
export const alignField = (fallback = "center") =>
  createField.select(
    [
      { label: "Centre", value: "center", id: "al-center" },
      { label: "Left", value: "left", id: "al-left" },
    ],
    { label: "Heading alignment", default: fallback, group: "Style" }
  );

/** Eyebrow / title / subtitle trio used by most sections. */
export const headingFields = (defaults: { eyebrow?: string; title?: string; subtitle?: string } = {}) => ({
  eyebrow: createField.text({ label: "Eyebrow", description: "Small label above the title.", default: defaults.eyebrow ?? "" }),
  title: createField.text({
    label: "Title",
    description: "Wrap words in *asterisks* to highlight them in the accent colour.",
    default: defaults.title ?? "",
  }),
  subtitle: createField.textarea({ label: "Subtitle", rows: 2, default: defaults.subtitle ?? "" }),
});

/** A button: label + link. Blank label hides it. */
export const buttonFields = (prefix: string, label: string, defaults: { label?: string; link?: string } = {}) => ({
  [`${prefix}Label`]: createField.text({ label: `${label} text`, description: "Blank hides the button.", default: defaults.label ?? "" }),
  [`${prefix}Link`]: createField.text({
    label: `${label} link`,
    description: 'A page ("/pricing"), section ("#faq") or full URL.',
    default: defaults.link ?? "#",
  }),
});

/**
 * Optional live data source for list blocks. Leave the endpoint blank to use
 * the static items saved in the page.
 */
export const apiSourceFields = (slots: Array<{ label: string; value: string }>, limit = "6") => ({
  apiCollection: createField.text({
    label: "API endpoint",
    description:
      'Collection key ("news"), path ("/api/news") or full URL ("https://api.site.com/news"). Blank uses the items above.',
    default: "",
    group: "Data",
  }),
  apiLimit: createField.text({
    label: "Max rows",
    default: limit,
    group: "Data",
    conditions: (data: Record<string, any>) => !!data.apiCollection,
  }),
  apiSort: createField.text({
    label: "Sort",
    description: "e.g. -date_created",
    default: "",
    group: "Data",
    conditions: (data: Record<string, any>) => !!data.apiCollection,
  }),
  apiFields: createField.repeater(
    {
      key: createField.select(
        slots.map((s) => ({ ...s, id: `slot-${s.value}` })),
        { label: "Component field", default: slots[0]?.value ?? "title" }
      ),
      value: createField.text({
        label: "API field name",
        description: "e.g. headline_text. Blank reads the field of the same name.",
        default: "",
      }),
    },
    {
      label: "API field mapping",
      repeaterFieldLabel: "key",
      default: [],
      group: "Data",
      conditions: (data: Record<string, any>) => !!data.apiCollection,
    }
  ),
});

/**
 * Wrap a block's fields.ts export with this. vue-wswg-editor shows only the
 * grouped fields once any field of a block has a `group` (each group is a
 * tab), so ungrouped fields (titles, text, items…) would never appear.
 * Put them on a "Content" tab, listed first.
 */
export function blockFields<T extends Record<string, any>>(fields: T, contentGroup = "Content"): T {
  const hasGroups = Object.values(fields).some((f) => f?.group);
  if (!hasGroups) return fields;
  const content: Record<string, any> = {};
  const rest: Record<string, any> = {};
  for (const [key, field] of Object.entries(fields)) {
    if (field && !field.group) content[key] = { ...field, group: contentGroup };
    else rest[key] = field;
  }
  return { ...content, ...rest } as T;
}

/** Stat cards shown in the "app screenshot" mockup visual (Hero, Text + image). */
export const mockupStatsField = () =>
  createField.repeater(
    {
      label: createField.text({ label: "Label", default: "Revenue" }),
      value: createField.text({ label: "Value", default: "$48.2k" }),
      change: createField.text({ label: "Change", description: 'e.g. "+12.4%". Blank hides it.', default: "" }),
      trend: createField.select(
        [
          { label: "Good (green)", value: "up", id: "mt-up" },
          { label: "Bad (red)", value: "down", id: "mt-down" },
        ],
        { label: "Change colour", default: "up" }
      ),
    },
    {
      label: "Stat cards",
      description: "Up to 4 cards in the screenshot. Remove all to hide them.",
      repeaterFieldLabel: "label",
      default: MOCKUP_STATS.map((s) => ({ ...s })),
      group: "Mockup",
      conditions: (d: Record<string, any>) => d.visual === "mockup",
    }
  );

/**
 * A URL field with an Upload button (app/page-builder/fields/UploadField.vue)
 * for videos and 3D models. The file goes to /api/upload, which stores it
 * (server/utils/media.ts) and the field gets its URL. Typing a URL still works.
 */
export const uploadField = (
  kind: "video" | "model",
  config: { label: string; description?: string; group?: string; conditions?: (d: Record<string, any>) => boolean }
) =>
  createField.custom({
    component: UploadField,
    default: "",
    // Passed through to UploadField as props
    uploadKind: kind,
    accept: kind === "video" ? "video/mp4,video/webm,.mp4,.webm" : ".glb,model/gltf-binary",
    placeholder: kind === "video" ? "/uploads/… or https://…/video.mp4" : "/uploads/… or https://…/model.glb",
    ...config,
  } as any);
