import { ReactElement, ReactTextElement } from "./react";
import NodeType from "./constant";

interface Fiber {
  DOM: HTMLElement | Text;
  type: string;
  props: any;
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
}

class ReactDOM {
  private static nextUnitOfWork: Fiber | null = null;
  static render(reactElement: ReactElement, container: HTMLElement): void {
    ReactDOM.nextUnitOfWork = {
      DOM: container,
      type: reactElement.type,
      props: {
        children: [reactElement]
      },
      parent: null,
      child: null,
      sibling: null
    }
    requestIdleCallback(ReactDOM.workLoop);
  }

  private static workLoop(deadline: IdleDeadline) {
    let shouldYield = false;

    while (!shouldYield && ReactDOM.nextUnitOfWork) {
      ReactDOM.nextUnitOfWork = ReactDOM.performUnitOfWork(ReactDOM.nextUnitOfWork);
      console.log(ReactDOM.nextUnitOfWork);
      shouldYield = deadline.timeRemaining() < 1;
    }

    requestIdleCallback(ReactDOM.workLoop);
  }

  private static performUnitOfWork(fiber: Fiber): Fiber | null {
    if (!fiber.DOM) {
      fiber.DOM = ReactDOM.createDOM(fiber);
    }

    if (fiber.parent) {
      fiber.parent.DOM.appendChild(fiber.DOM);
    }

    let siblingFiber = fiber.sibling;
    fiber.props.children.map((childFiber, index) => {
      if (index === 0) {
        fiber.child = childFiber;
        childFiber.parent = fiber;
      } else {
        if (!siblingFiber) {
          siblingFiber = childFiber;
          fiber.sibling = siblingFiber;
        } else {
          siblingFiber.sibling = childFiber;
          siblingFiber = childFiber;
        }
        (siblingFiber as Fiber).parent = fiber;
      }
    });

    if (fiber.child) {
      return fiber.child;
    } else {
      let nextFiber = fiber;
      while (nextFiber) {
        if (nextFiber.sibling) {
          return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent as Fiber;
      }

      return nextFiber;
    }
  }

  private static createDOM(reactElement: Fiber): HTMLElement | Text {
    const dom = reactElement.type === NodeType.TEXT_ELEMENT
      ? document.createTextNode('')
      : document.createElement(reactElement.type);

    const isProperty = i => i !== 'children';
    Object
      .keys(reactElement.props)
      .filter(isProperty)
      .map(p => dom[p] = reactElement.props[p]);

    return dom;
  }
}

export default ReactDOM;