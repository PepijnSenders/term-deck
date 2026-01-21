/**
 * Pre-load neo-blessed widgets to work with bun compile
 * This patches neo-blessed to use static requires instead of dynamic ones
 */

// Explicitly import all widget files that neo-blessed would dynamically require
// This ensures bun compile includes them in the binary
import node from 'neo-blessed/lib/widgets/node.js';
import screen from 'neo-blessed/lib/widgets/screen.js';
import element from 'neo-blessed/lib/widgets/element.js';
import box from 'neo-blessed/lib/widgets/box.js';
import text from 'neo-blessed/lib/widgets/text.js';
import line from 'neo-blessed/lib/widgets/line.js';
import scrollablebox from 'neo-blessed/lib/widgets/scrollablebox.js';
import scrollabletext from 'neo-blessed/lib/widgets/scrollabletext.js';
import bigtext from 'neo-blessed/lib/widgets/bigtext.js';
import list from 'neo-blessed/lib/widgets/list.js';
import form from 'neo-blessed/lib/widgets/form.js';
import input from 'neo-blessed/lib/widgets/input.js';
import textarea from 'neo-blessed/lib/widgets/textarea.js';
import textbox from 'neo-blessed/lib/widgets/textbox.js';
import button from 'neo-blessed/lib/widgets/button.js';
import progressbar from 'neo-blessed/lib/widgets/progressbar.js';
import filemanager from 'neo-blessed/lib/widgets/filemanager.js';
import checkbox from 'neo-blessed/lib/widgets/checkbox.js';
import radioset from 'neo-blessed/lib/widgets/radioset.js';
import radiobutton from 'neo-blessed/lib/widgets/radiobutton.js';
import prompt from 'neo-blessed/lib/widgets/prompt.js';
import question from 'neo-blessed/lib/widgets/question.js';
import message from 'neo-blessed/lib/widgets/message.js';
import loading from 'neo-blessed/lib/widgets/loading.js';
import listbar from 'neo-blessed/lib/widgets/listbar.js';
import log from 'neo-blessed/lib/widgets/log.js';
import table from 'neo-blessed/lib/widgets/table.js';
import listtable from 'neo-blessed/lib/widgets/listtable.js';
import terminal from 'neo-blessed/lib/widgets/terminal.js';
import image from 'neo-blessed/lib/widgets/image.js';
import ansiimage from 'neo-blessed/lib/widgets/ansiimage.js';
import overlayimage from 'neo-blessed/lib/widgets/overlayimage.js';
import video from 'neo-blessed/lib/widgets/video.js';
import layout from 'neo-blessed/lib/widgets/layout.js';

// Import blessed
import blessed from 'neo-blessed';

// Manually assign all widgets to blessed object
// This bypasses neo-blessed's dynamic require()
blessed.Node = blessed.node = node;
blessed.Screen = blessed.screen = screen;
blessed.Element = blessed.element = element;
blessed.Box = blessed.box = box;
blessed.Text = blessed.text = text;
blessed.Line = blessed.line = line;
blessed.ScrollableBox = blessed.scrollablebox = scrollablebox;
blessed.ScrollableText = blessed.scrollabletext = scrollabletext;
blessed.BigText = blessed.bigtext = bigtext;
blessed.List = blessed.list = list;
blessed.Form = blessed.form = form;
blessed.Input = blessed.input = input;
blessed.Textarea = blessed.textarea = textarea;
blessed.Textbox = blessed.textbox = textbox;
blessed.Button = blessed.button = button;
blessed.ProgressBar = blessed.progressbar = progressbar;
blessed.FileManager = blessed.filemanager = filemanager;
blessed.Checkbox = blessed.checkbox = checkbox;
blessed.RadioSet = blessed.radioset = radioset;
blessed.RadioButton = blessed.radiobutton = radiobutton;
blessed.Prompt = blessed.prompt = prompt;
blessed.Question = blessed.question = question;
blessed.Message = blessed.message = message;
blessed.Loading = blessed.loading = loading;
blessed.Listbar = blessed.listbar = listbar;
blessed.Log = blessed.log = log;
blessed.Table = blessed.table = table;
blessed.ListTable = blessed.listtable = listtable;
blessed.Terminal = blessed.terminal = terminal;
blessed.Image = blessed.image = image;
blessed.ANSIImage = blessed.ansiimage = ansiimage;
blessed.OverlayImage = blessed.overlayimage = overlayimage;
blessed.Video = blessed.video = video;
blessed.Layout = blessed.layout = layout;

// Aliases
blessed.ListBar = blessed.Listbar;
blessed.PNG = blessed.ANSIImage;

export default blessed;
