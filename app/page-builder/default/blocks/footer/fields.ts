import { createField } from "vue-wswg-editor";
import { blockFields, toneField } from "../../../../utils/pb-fields";

export default blockFields({
  logo: createField.image({ label: "Logo", description: "Blank shows the brand initials." }),
  brandName: createField.text({ label: "Brand name", default: "Brand" }),
  description: createField.textarea({ label: "Short description", rows: 2, default: "" }),
  columns: createField.repeater(
    {
      title: createField.text({ label: "Column title", default: "Company" }),
      links: createField.textarea({
        label: "Links",
        description: 'One per line as "Label | /link", e.g. "About | /about".',
        rows: 5,
        default: "About | /about\nContact | /contact",
      }),
    },
    { label: "Link columns", repeaterFieldLabel: "title", default: [] }
  ),
  socials: createField.repeater(
    {
      icon: createField.text({ label: "Icon", description: 'e.g. "linkedin", "instagram", "facebook", "github", "youtube".', default: "linkedin" }),
      link: createField.text({ label: "Link", default: "https://" }),
    },
    { label: "Social links", repeaterFieldLabel: "icon", default: [] }
  ),
  legal: createField.textarea({ label: "Bottom links", description: 'e.g. "Privacy | /privacy". One per line.', rows: 2, default: "" }),
  copyright: createField.text({ label: "Copyright", description: "{year} becomes the current year.", default: "© {year} Company. All rights reserved." }),
  tone: toneField("muted"),
});
