import { ReactElement, ReactTextElement } from "./react";
import NodeType from "./constant";

class ReactDOM {
  static render(reactElement: ReactElement, container: HTMLElement): void {

    const dom = reactElement.type === NodeType.TEXT_ELEMENT
      ? document.createTextNode('')
      : document.createElement(reactElement.type);

    const isProperty = i => i !== 'children';
    Object
      .keys(reactElement.props)
      .filter(isProperty)
      .map(p => dom[p] = reactElement.props[p]);

    reactElement.props.children.map(child => {
      this.render(child, dom as HTMLElement);
    })

    container.appendChild(dom);
  }
}

export default ReactDOM;