import { createField } from "vue-wswg-editor";
import { blockFields, mockupStatsField, uploadField, buttonFields, toneField } from "../../../../utils/pb-fields";

export default blockFields({
  badge: createField.text({ label: "Announcement pill", description: "Small pill above the title. Blank hides it.", default: "" }),
  badgeTag: createField.text({ label: "Announcement tag", description: 'Coloured label inside the pill, e.g. "New". Blank hides it.', default: "New", conditions: (d) => !!d.badge }),
  badgeLink: createField.text({ label: "Announcement link", default: "#", conditions: (d) => !!d.badge }),
  title: createField.text({
    label: "Title",
    description: "Wrap words in *asterisks* to highlight them.",
    default: "Build something *people love*",
  }),
  subtitle: createField.textarea({ label: "Subtitle", rows: 3, default: "" }),
  ...buttonFields("primary", "Main button", { label: "Get started", link: "#" }),
  ...buttonFields("secondary", "Second button", { label: "", link: "#" }),
  note: createField.text({ label: "Small note", description: 'e.g. "No credit card required"', default: "" }),

  layout: createField.select(
    [
      { label: "Centred", value: "centered", id: "hl-centered" },
      { label: "Text left, visual right", value: "split", id: "hl-split" },
    ],
    { label: "Layout", default: "centered", group: "Style" }
  ),
  visual: createField.select(
    [
      { label: "App screenshot mockup", value: "mockup", id: "hv-mockup" },
      { label: "Image", value: "image", id: "hv-image" },
      { label: "Video", value: "video", id: "hv-video" },
      { label: "3D shape", value: "shape3d", id: "hv-shape3d" },
      { label: "3D model (.glb)", value: "model", id: "hv-model" },
      { label: "None", value: "none", id: "hv-none" },
    ],
    { label: "Visual", default: "mockup", group: "Visual" }
  ),
  image: createField.image({ label: "Visual image", conditions: (d) => d.visual === "image", group: "Visual" }),
  video: uploadField("video", {
    label: "Video",
    description: "Upload an .mp4 or .webm, or paste a video URL. Plays muted on a loop.",
    conditions: (d) => d.visual === "video",
    group: "Visual",
  }),
  videoPoster: createField.image({
    label: "Video poster",
    description: "Shown while the video loads.",
    conditions: (d) => d.visual === "video",
    group: "Visual",
  }),
  shape: createField.select(
    [
      { label: "Knot", value: "knot", id: "hs-knot" },
      { label: "Gem", value: "gem", id: "hs-gem" },
      { label: "Rings", value: "rings", id: "hs-rings" },
      { label: "Sphere", value: "sphere", id: "hs-sphere" },
    ],
    {
      label: "3D shape",
      description: "Glossy, in the accent colour. Visitors can drag to spin it.",
      default: "knot",
      conditions: (d) => d.visual === "shape3d",
      group: "Visual",
    }
  ),
  model: uploadField("model", {
    label: "3D model",
    description: "Upload a .glb file, or paste its URL. Visitors can drag to rotate it.",
    conditions: (d) => d.visual === "model",
    group: "Visual",
  }),
  autoRotate: createField.boolean({
    label: "Spin slowly",
    default: true,
    conditions: (d) => d.visual === "shape3d" || d.visual === "model",
    group: "Visual",
  }),
  tilt: createField.boolean({
    label: "3D tilt on hover",
    description: "The visual tilts toward the mouse.",
    default: false,
    conditions: (d) => ["mockup", "image", "video"].includes(d.visual),
    group: "Visual",
  }),
  mockupStats: mockupStatsField(),
  background: createField.select(
    [
      { label: "Accent glow", value: "glow", id: "hb-glow" },
      { label: "Grid lines", value: "grid", id: "hb-grid" },
      { label: "Photo", value: "image", id: "hb-image" },
      { label: "Video", value: "video", id: "hb-video" },
      { label: "Plain", value: "plain", id: "hb-plain" },
    ],
    { label: "Backdrop", default: "glow", group: "Style" }
  ),
  backgroundImage: createField.image({
    label: "Backdrop photo",
    description: "Darkened so white text stays readable. With a video backdrop, it shows while the video loads.",
    conditions: (d) => d.background === "image" || d.background === "video",
    group: "Style",
  }),
  backgroundVideo: uploadField("video", {
    label: "Backdrop video",
    description: "Upload an .mp4 or .webm, or paste a URL. Darkened, muted, looping.",
    conditions: (d) => d.background === "video",
    group: "Style",
  }),
  tone: toneField("light"),
});
