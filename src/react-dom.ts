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
  private static oldFiber: Fiber | null = null;
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

    ReactDOM.oldFiber = ReactDOM.nextUnitOfWork;

    requestIdleCallback(ReactDOM.workLoop);
  }

  private static commitRoot() {
    ReactDOM.commitWork(ReactDOM.oldFiber!.child);
  }

  private static commitWork(fiber: Fiber | null) {
    if (!fiber) return;
    fiber.parent?.DOM.appendChild(fiber.DOM);

    fiber.child && ReactDOM.commitWork(fiber.child);
    fiber.sibling && ReactDOM.commitWork(fiber.sibling);
  }

  private static workLoop(deadline: IdleDeadline) {
    let shouldYield = false;

    while (!shouldYield && ReactDOM.nextUnitOfWork) {
      ReactDOM.nextUnitOfWork = ReactDOM.performUnitOfWork(ReactDOM.nextUnitOfWork);

      shouldYield = deadline.timeRemaining() < 1;
    }

    if (!ReactDOM.nextUnitOfWork) {
      ReactDOM.commitRoot();
    } else {
      requestIdleCallback(ReactDOM.workLoop);
    }

  }

  private static performUnitOfWork(fiber: Fiber): Fiber | null {
    if (!fiber.DOM) {
      fiber.DOM = ReactDOM.createDOM(fiber);
    }

    let siblingFiber: Fiber | null = null;
    fiber.props.children.map((childFiber: Fiber, index) => {
      childFiber.parent = fiber;
      if (index === 0) {
        fiber.child = childFiber;
        siblingFiber = fiber.child;
      } else {
        siblingFiber!.sibling = childFiber;
        siblingFiber = siblingFiber!.sibling;
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