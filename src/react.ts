import NodeType from "./constant";

export interface ReactElement {
  type: string;
  props: {
    children: Array<ReactElement>
  };
}

export interface ReactTextElement extends ReactElement {
  props: {
    nodeValue: string;
    children: Array<ReactElement>
  }
}

class React {
  static createElement(type: string, props: object[], ...children: Array<ReactElement | string>): ReactElement {
    return {
      type,
      props: {
        ...props,
        children: children.map(child => (typeof child === 'object' ? child : this.createTextElement(child)))
      },
    }
  }

  private static createTextElement(text: string): ReactTextElement {
    return {
      type: NodeType.TEXT_ELEMENT,
      props: {
        nodeValue: text,
        children: [],
      }
    }
  }
}

export default React;