/**
 * Pre-load neo-blessed widgets to work with bun compile
 * This ensures all widgets are statically analyzed and bundled
 */

// Import blessed first
import blessed from 'neo-blessed';

// Force load all widget modules by accessing them
// This helps bun's bundler include them in the compiled binary
if (typeof blessed === 'object' && blessed !== null) {
  // Touch the widget classes to ensure they're loaded
  const _ = {
    Node: blessed.Node,
    Screen: blessed.Screen,
    Element: blessed.Element,
    Box: blessed.Box,
    Text: blessed.Text,
    Line: blessed.Line,
    ScrollableBox: blessed.ScrollableBox,
    ScrollableText: blessed.ScrollableText,
    BigText: blessed.BigText,
    List: blessed.List,
    Form: blessed.Form,
    Input: blessed.Input,
    Textarea: blessed.Textarea,
    Textbox: blessed.Textbox,
    Button: blessed.Button,
    ProgressBar: blessed.ProgressBar,
    FileManager: blessed.FileManager,
    Checkbox: blessed.Checkbox,
    RadioSet: blessed.RadioSet,
    RadioButton: blessed.RadioButton,
    Prompt: blessed.Prompt,
    Question: blessed.Question,
    Message: blessed.Message,
    Loading: blessed.Loading,
    Listbar: blessed.Listbar,
    Log: blessed.Log,
    Table: blessed.Table,
    ListTable: blessed.ListTable,
    Terminal: blessed.Terminal,
    Image: blessed.Image,
    ANSIImage: blessed.ANSIImage,
    OverlayImage: blessed.OverlayImage,
    Video: blessed.Video,
    Layout: blessed.Layout,
  };
}

export default blessed;
