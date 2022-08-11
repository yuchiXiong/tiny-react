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
  static Component;
  static createElement(type: string | Function | typeof React.Component, props: object[], ...children: Array<ReactElement | string>): ReactElement {
    if (typeof type === "string") {
      return {
        type: type,
        props: {
          ...props,
          children: children.map(child => (typeof child === 'object' ? child : this.createTextElement(child)))
        },
      }
    } else {
      if (type.isReactComponent) {
        const instance = new type();
        return instance.render();
      } else {
        return type();
      }
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

React.Component = class {
  static isReactComponent: boolean = true;
  constructor() {
  }
}

export default React;