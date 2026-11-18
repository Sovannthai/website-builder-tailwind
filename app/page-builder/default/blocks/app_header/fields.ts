import { createField } from "vue-wswg-editor";
import { blockFields, buttonFields, apiSourceFields } from "../../../../utils/pb-fields";

export default blockFields({
  // --- Branding -----------------------------------------------------------
  logo: createField.image({
    label: "Logo",
    description: "Blank shows the brand initials in the accent colour.",
  }),
  brandName: createField.text({ label: "Brand name", description: "Blank hides it.", default: "Brand" }),

  // The menu is shared by every page of the site (saved to the site's
  // menu.json), so editing it here updates all pages.
  menus: createField.repeater(
    {
      title: createField.text({ label: "Title", default: "Menu item" }),
      path: createField.text({ label: "Link", description: 'A page ("/about") or section ("#faq").', default: "/" }),
      children: createField.repeater(
        {
          title: createField.text({ label: "Title", default: "Sub item" }),
          path: createField.text({ label: "Link", default: "/" }),
        },
        { label: "Dropdown items", repeaterFieldLabel: "title", default: [] }
      ),
    },
    { label: "Menu items", repeaterFieldLabel: "title", default: [] }
  ),

  ...buttonFields("cta", "Main button", { label: "Get started", link: "#" }),
  ...buttonFields("secondary", "Secondary link", { label: "", link: "#" }),

  variant: createField.select(
    [
      { label: "Frosted glass", value: "glass", id: "hs-glass" },
      { label: "Solid white", value: "light", id: "hs-light" },
      { label: "Dark", value: "dark", id: "hs-dark" },
    ],
    { label: "Style", default: "glass", group: "Style" }
  ),
  sticky: createField.boolean({ label: "Stick to top while scrolling", default: true, group: "Style" }),

  ...apiSourceFields(
    [
      { label: "Title", value: "title" },
      { label: "Link", value: "path" },
    ],
    "20"
  ),
});
