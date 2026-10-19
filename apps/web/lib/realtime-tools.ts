// Tools for ABI's OpenAI Realtime voice (power mode). The voice model handles page actions
// itself and delegates everything about Abhishek to ABI's full agent (ask_abi), which searches
// his real data. The browser runs them all: components/abi/realtime.ts.

const str = (description: string) => ({ type: "string", description });
const oneOf = (values: string[], description = "") => ({ type: "string", enum: values, ...(description && { description }) });

function tool(name: string, description: string, properties: Record<string, object> = {}, required: string[] = []) {
  return { type: "function", name, description, parameters: { type: "object", properties, required, additionalProperties: false } };
}

export const REALTIME_TOOLS = [
  tool(
    "ask_abi",
    "Delegate to ABI's full agent. Use for ANY question about Abhishek: projects, skills, experience, education, " +
      "code from his repos, GitHub stats, comparing projects, matching a job description, a tailored resume, " +
      "drafting a contact message or booking a call. It searches his real data, shows cards in the chat panel " +
      "and may act on the page. Returns the written answer.",
    { question: str("The visitor's request, rewritten as a clear, complete question or task.") },
    ["question"],
  ),
  tool(
    "navigate",
    "Open a page: /, /projects, /projects/<slug>, /skills, /about, /contact, /abi, /lab, /resume. Optionally highlight a section id.",
    { path: str("Page path"), section: str("Optional section id, or empty") },
    ["path", "section"],
  ),
  tool(
    "filter_projects",
    "Show the projects page filtered by category and type.",
    {
      category: oneOf(["all", "AI", "Full Stack", "DevOps", "Frontend", "React Native"]),
      type: oneOf(["all", "personal", "client"], "personal = built for fun, client = professional work"),
    },
    ["category", "type"],
  ),
  tool(
    "filter_skills",
    "Show the skills page filtered to one category.",
    { category: oneOf(["all", "AI", "Frontend", "Backend", "Languages", "Database", "DevOps", "Cloud", "Tools", "Testing"]) },
    ["category"],
  ),
  tool(
    "scroll",
    "Scroll the current page. little = a quarter screen, more = half, page = one screen, end = top or bottom.",
    { direction: oneOf(["down", "up"]), amount: oneOf(["little", "more", "page", "end"]) },
    ["direction", "amount"],
  ),
  tool("click", "Click a visible button, link, tab or card by its text.", { label: str("The visible text") }, ["label"]),
  tool(
    "type_text",
    "Type into a visible field on the current page (search, name, email, subject, message).",
    { field: str("The field's label"), text: str("What to type") },
    ["field", "text"],
  ),
  tool(
    "control",
    "Page and panel controls. section = scroll to the section named in value. panel_* = ABI's chat panel. " +
      "zoom_* = page zoom. copy_email / copy_link = clipboard. stop = stop a tour.",
    {
      action: oneOf([
        "section", "panel_full", "panel_dock", "panel_float", "panel_close", "open_menu", "close_menu",
        "forward", "back", "zoom_in", "zoom_out", "zoom_reset", "copy_email", "copy_link", "stop",
      ]),
      value: str("Section name for action=section, else empty"),
    },
    ["action", "value"],
  ),
  tool("set_theme", "Switch the website theme.", { theme: oneOf(["light", "dark"]) }, ["theme"]),
  tool("tour_page", "Walk through the whole current page from top to bottom, pausing on each section."),
  tool("end_conversation", "End the voice conversation when the visitor says goodbye or asks to stop talking."),
];
