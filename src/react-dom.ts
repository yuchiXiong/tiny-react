import { ReactElement, ReactTextElement } from "./react";
import NodeType from "./constant";

interface Fiber {
  DOM: HTMLElement | Text;
  type: string;
  props: any;
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: Fiber | null;
}

class ReactDOM {

  private static currentFiber: Fiber | null = null;
  private static oldFiber: Fiber | null = null;
  private static nextUnitOfWork: Fiber | null = null;

  static render(reactElement: ReactElement, container: HTMLElement): void {
    ReactDOM.oldFiber = ReactDOM.currentFiber;
    ReactDOM.nextUnitOfWork = {
      DOM: container,
      type: reactElement.type,
      props: {
        children: [reactElement]
      },
      parent: null,
      child: null,
      sibling: null,
      alternate: ReactDOM.oldFiber,
    };
    ReactDOM.currentFiber = ReactDOM.nextUnitOfWork;

    requestIdleCallback(ReactDOM.workLoop);
  }

  private static commitRoot() {
    ReactDOM.commitWork(ReactDOM.currentFiber!.child);
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
    const isSameType = fiber.type === fiber.alternate?.type;
    const isProperty = i => i !== 'children';
    const props = Object.keys(fiber.props).filter(isProperty);
    const newProps = props.filter(p => fiber.props[p] !== fiber.alternate?.props[p]);
    const isSameProp = newProps.length === 0;

    if (!isSameType) {

      fiber.DOM ||= ReactDOM.createDOM(fiber);

      fiber.alternate && ReactDOM.deleteDOM(fiber.alternate);
    } else if (isSameType && !isSameProp) {
      fiber.DOM = fiber.alternate!.DOM;
      Object.keys(fiber.alternate?.props).filter(isProperty).map(p => fiber.DOM[p] = '');
      Object.keys(fiber.props).filter(isProperty).map(p => fiber.DOM[p] = fiber.props[p]);
    } else {
      fiber.DOM = fiber.alternate!.DOM;
    }

    let oldFiber = fiber.alternate;

    let siblingFiber: Fiber | null = null;
    let nextOldFiber: Fiber | null = null;
    fiber.props.children.map((childFiber: Fiber, index) => {
      childFiber.parent = fiber;
      if (index === 0) {
        fiber.child = childFiber;
        siblingFiber = fiber.child;
        childFiber.alternate = oldFiber?.child || null;
        nextOldFiber = childFiber.alternate;
      } else {
        siblingFiber!.sibling = childFiber;
        siblingFiber!.alternate = nextOldFiber || null;
        siblingFiber = siblingFiber!.sibling;
        nextOldFiber = nextOldFiber?.sibling || null;
      }

      if (index === fiber.props.children.length - 1 && nextOldFiber) {
        while (nextOldFiber) {
          ReactDOM.deleteDOM(nextOldFiber);
          nextOldFiber = nextOldFiber.sibling;
        }
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

  private static deleteDOM(fiber: Fiber): void {
    if (fiber.DOM) {
      fiber.DOM.remove();
    }
  }
}

export default ReactDOM;