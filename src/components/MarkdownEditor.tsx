import * as React from "react";
import styled from "styled-components";
import DOMPurify from "dompurify";
import marked from "marked";

const formatter: any = {
  name: "format",
  level: "inline", // Is this a block-level or inline-level tokenizer?
  start(src: string) {
    return src.match(/{/)?.index;
  }, // Hint to Marked.js to stop and check for a match
  tokenizer(src: string, tokens: any): any {
    const rule = /^{([^|\n]+)\|([^}\n]+)}(?:\n|$)/; // Regex for the complete token
    const match = rule.exec(src);
    if (match) {
      return {
        // Token to generate
        type: "format", // Should match "name" above
        raw: match[0], // Text to consume from the source
        dt: this.lexer.inlineTokens(match[1].trim()), // Additional custom properties, including
        dd: this.lexer.inlineTokens(match[2].trim()), //   any further-nested inline tokens
      };
    }
  },
  renderer(token: any) {
    return `\n<dt>${this.parser.parseInline(
      token.dt
    )}</dt><dd>${this.parser.parseInline(token.dd)}</dd>`;
  },
  childTokens: ["dt", "dd"], // Any child tokens to be visited by walkTokens
  walkTokens(token: any) {
    // Post-processing on the completed token tree
    if (token.type === "strong") {
      token.text += " walked";
    }
  },
};

marked.use({ extensions: [formatter] });

const CopyButton = styled("button")`
  position: absolute;
  right: 50%;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
  border-top-left-radius: 0;
`;

const Page = styled("div")``;

const Button = styled("button")``;

const FlexContainer = styled("div")`
  display: flex;
  height: calc(100vh - 65px);
  flex-item: stretch;
`;

const Menu = styled("div")`
  height: 65px;
  padding: 15px;
  box-sizing: border-box;
  font-size: 2rem;
  font-weight: bold;
  display: flex;
  align-items: center;

  & > .button:not(first-child) {
    margin-left: 0.5em;
  }
`;

const ButtonsAddons = styled("div")`
  & > .button {
    margin-bottom: 0 !important;
  }
`;

const Textarea = styled("textarea")`
  flex-basis: 50%;
  padding: 25px;
  box-sizing: border-box;
  border-top: none;
  border-left: none;
  border-bottom: none;
  border-right: 1px solid #dbdbdb;
  border-top: 1px solid #dbdbdb;
  resize: none;

  &:focus {
    outline: none;
  }
`;

const MarkdownPreview = styled("article")`
  border-top: 1px solid #dbdbdb;
  flex-basis: 50%;
  padding: 25px;
  box-sizing: border-box;
  overflow: auto;
`;

function MarkdownEditor(): JSX.Element {
  const [input, setInput] = React.useState({ value: "" });
  const [parsedMarkdown, setParsedMarkdown] = React.useState({ value: "" });

  void parsedMarkdown;

  const editorInput = React.useRef(document.createElement("textarea"));

  const focusEditor = (start: number, end?: number) =>
    setTimeout(() => {
      editorInput.current.focus();
      editorInput.current.setSelectionRange(start, end ?? start);
    });

  React.useEffect(() => {
    const md = DOMPurify.sanitize(marked(input.value));
    setParsedMarkdown({ value: md });
  }, [setParsedMarkdown, input.value]);

  const handleInput = (
    e: React.FormEvent<HTMLTextAreaElement> & { target: HTMLTextAreaElement }
  ) => {
    setInput({ value: e.target.value });
  };

  const insertSurroundingModifier = (modifier: string) => {
    const modifierLength = modifier.length;
    const [start, end] = [
      editorInput.current.selectionStart,
      editorInput.current.selectionEnd,
    ];
    if (start === end) {
      editorInput.current.setRangeText(modifier);
      editorInput.current.setRangeText(modifier);
      focusEditor(end + modifierLength);
    } else {
      editorInput.current.setRangeText(modifier, start, start);
      editorInput.current.setRangeText(
        modifier,
        end + modifierLength,
        end + modifierLength
      );
      focusEditor(start, end + modifierLength * 2);
    }
    setInput({ value: editorInput.current.value });
  };

  const insertSurroundingFormatter = (
    leftModifier: string,
    rightModifier: string
  ) => {
    const leftModifierLength = leftModifier.length;
    const rightModifierLength = rightModifier.length;
    const [start, end] = [
      editorInput.current.selectionStart,
      editorInput.current.selectionEnd,
    ];
    if (start === end) {
      editorInput.current.setRangeText(rightModifier);
      editorInput.current.setRangeText(leftModifier);
      focusEditor(end + leftModifierLength);
    } else {
      editorInput.current.setRangeText(leftModifier, start, start);
      editorInput.current.setRangeText(
        rightModifier,
        end + rightModifierLength,
        end + rightModifierLength
      );
      focusEditor(start, end + leftModifierLength + rightModifierLength);
    }
    setInput({ value: editorInput.current.value });
  };

  const handleBold = () => insertSurroundingModifier("**");
  const handleItalic = () => insertSurroundingModifier("*");
  const handleStrikethrough = () => insertSurroundingModifier("~~");
  const injectTable = (): void => {
    return;
  };

  const handleFormatter = () => insertSurroundingFormatter("{", "|hours}");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(input.value);
  };

  return (
    <Page>
      <Menu>
        <ButtonsAddons className="mb-0 buttons has-addons">
          <Button onClick={handleBold}>bold</Button>
          <Button onClick={handleItalic}>italic</Button>
          <Button onClick={handleStrikethrough}>strike</Button>
          <Button onClick={handleFormatter}>format</Button>
        </ButtonsAddons>
        <Button onClick={injectTable}>table</Button>
      </Menu>
      <FlexContainer>
        <Textarea
          tabIndex={1}
          onInput={handleInput}
          placeholder="Type some Markdown ..."
          ref={editorInput}
        />
        <CopyButton onClick={copyToClipboard}>copy markdown</CopyButton>
        <MarkdownPreview
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: parsedMarkdown.value }}
        />
      </FlexContainer>
    </Page>
  );
}

export default MarkdownEditor;
