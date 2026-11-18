import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, toneField, spaceField, alignField } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields({ eyebrow: "Team", title: "The people behind the *work*" }),
  members: createField.repeater(
    {
      name: createField.text({ label: "Name", default: "Team member" }),
      role: createField.text({ label: "Role", default: "" }),
      photo: createField.image({ label: "Photo", description: "Blank shows initials." }),
      link: createField.text({ label: "Profile link", description: "Optional (LinkedIn, etc.).", default: "" }),
    },
    { label: "Members", repeaterFieldLabel: "name", default: [] }
  ),
  align: alignField("left"),
  tone: toneField("light"),
  space: spaceField("md"),
});
