//This is the newer fiber approach
// render->workloop->performunitofwork->reconcilechildren->commitroot->commitwork
//all the oter functions are helper functions
/**@jsx maya.createElement */
/**@jsxFrag maya.Fragment */
function createElement(type, props, ...children) {
    const normalizedProps = props || {}; 
    const { key = null, ...restProps } = normalizedProps;
    return {
        type,
        key,
        props: {
            ...restProps,
            children: children
                .flat()
                .filter(child => child !== null && child !== undefined && child !== false) 
                .map(child =>
                    typeof child === "object" ? child : createTextElement(child)
                )
        }
    };
}

function createTextElement(text){
    return {
        type:"text",
        key:null,
        props:{
            nodeValue: text,
            children:[]
        }
    }
}

function createDOM(fiber){
    const dom=fiber.type=="text"? document.createTextNode(fiber.props.nodeValue): document.createElement(fiber.type);
    Object.keys(fiber.props).filter(key=>key!=="children").forEach(propertyName=>{
        dom[propertyName]=fiber.props[propertyName];
    });
    updateChild(dom,{},fiber.props);
    return dom;
}

function commitRoot(){
    deleteFibers.forEach(fiber=>commitWork(fiber));
    commitWork(WIPRoot.child);
    currentRoot=WIPRoot;
    WIPRoot=null;
}

function commitWork(fiber) {
    if (!fiber) return;
    let domParentFiber = fiber.parent;
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber.dom;
    if (fiber.effectTag === "insert" && fiber.dom != null) {
        const beforeDom = getHostSibling(fiber);
        domParent.insertBefore(fiber.dom, beforeDom);
    } 
    else if (fiber.effectTag === "update" && fiber.dom != null) {
        updateChild(fiber.dom, fiber.alternate.props, fiber.props);
    }
    else if (fiber.effectTag === "delete") {
        commitDeletion(fiber, domParent);
        return;
    } 

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child, domParent);
    }
}

function getHostSibling(fiber) {
    let node = fiber.sibling;
    while (node) {
        if (node.dom && node.effectTag !== "insert" && node.effectTag !== "placement") {
            return node.dom;
        }
        if (node.child) {
            node = node.child;
            continue;
        }
        node = node.sibling;
    }
    return null;
}

function updateChild(dom,prevProps,nextProps){
    const isEvent=key=>key.startsWith("on");
    const isProperty=key=>key!=="children";
    const isGone=(key)=>!(key in nextProps);
    const isNew=(key)=>prevProps[key]!==nextProps[key];
    Object.keys(prevProps).filter(isEvent).filter(key=>isGone(key) || isNew(key)).forEach(eventName=>{
        const eventType=eventName.toLowerCase().substring(2);
        dom.removeEventListener(eventType,prevProps[eventName]);
    });
    Object.keys(nextProps).filter(isEvent).filter(isNew).forEach(eventName=>{
        const eventType=eventName.toLowerCase().substring(2);
        dom.addEventListener(eventType,nextProps[eventName]);
    });
    Object.keys(prevProps).filter(isProperty).filter(isGone).forEach(propertyName=>{
        dom[propertyName]="";
    });
    Object.keys(nextProps).filter(isProperty).filter(isNew).forEach(propertyName=>{
        dom[propertyName]=nextProps[propertyName];
    });
}   

function render(element,container){
    WIPRoot={
        dom:container,
        props:{
            children:[element],
        },
        alternate:currentRoot,
    };
    deleteFibers=[];
    nextUnitOfWork=WIPRoot;  
}

// the requestIdleCallback is a built-in api that allows us to work concurrent mode
let nextUnitOfWork=null;
let currentRoot=null;
let WIPRoot=null;
let deleteFibers=[];
function workLoop(deadline){
    let shouldYield=false;
    while(nextUnitOfWork && !shouldYield){
        nextUnitOfWork=performUnitOfWork(nextUnitOfWork);
        shouldYield=deadline.timeRemaining()<1;
    }
    requestIdleCallback(workLoop);
    if(!nextUnitOfWork && WIPRoot){
        commitRoot();
    }
}
requestIdleCallback(workLoop);

//it breaks monolouthic work into smaller units,it is similar to render function of reconciliation
function performUnitOfWork(fiber){
    if(typeof fiber.type==="function") {
        updateFunctionComponent(fiber);
    }
    else {
        if(!fiber.dom){
            fiber.dom=createDOM(fiber);
        }
        const elements = fiber.props.children ? fiber.props.children : [];
        reconcileChildren(fiber,elements);
    }
    if(fiber.child){
        return fiber.child;
    }
    //go to sibling then to sibling's childs and so on(traversing the tree)
    let nextFiber=fiber;
    while(nextFiber){
        if(nextFiber.sibling){
            return nextFiber.sibling;
        }
        nextFiber=nextFiber.parent;
    }
}

let wipFiber=null;
let hookIndex=0;
function updateFunctionComponent(fiber){
    wipFiber=fiber;
    hookIndex=0;
    wipFiber.hooks=[];
    if(fiber.props.children) {
        const children=[fiber.type(fiber.props)];
        reconcileChildren(fiber,children);
    }
}

function mayaStates(initial){
    const oldHook=wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
    const hook={
        state:oldHook?oldHook.state:initial,
        queue:[]
    }
    const action=oldHook?oldHook.queue:[];
    action.forEach(act=>{
        hook.state=typeof act==="function"? act(hook.state): act;
    });
    const setState=action=>{
        hook.queue.push(action);
        WIPRoot={
            dom:currentRoot.dom,
            props:currentRoot.props,
            alternate:currentRoot,
        }
        nextUnitOfWork=WIPRoot;
        deleteFibers=[];
    }
    wipFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state,setState];
}

//most useful while comparing with previous existing fiber tree
function reconcileChildren(wipFiber, elements) {
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null;
    let lastPlacedIndex = 0;
    const existingChildren = new Map();
    let tempOld = oldFiber;
    let k = 0;
    while (tempOld) {
        tempOld.index = k;
        existingChildren.set(tempOld.key !== null ? tempOld.key : k, tempOld);
        tempOld = tempOld.sibling;
        k++;
    }
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const key = element.key !== null ? element.key : i;
        let oldMatch = existingChildren.get(key);
        let newFiber = null;

        if (oldMatch && oldMatch.type === element.type) {
            newFiber = {
                type: oldMatch.type,
                key: oldMatch.key,
                props: element.props,
                dom: oldMatch.dom,
                parent: wipFiber,
                alternate: oldMatch,
                effectTag: "update",
            };
            if (oldMatch.index < lastPlacedIndex) {
                newFiber.effectTag = "insert";
            } else {
                lastPlacedIndex = oldMatch.index;
            }
            existingChildren.delete(key);
        } else {
            newFiber = {
                type: element.type,
                key: element.key,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "insert",
            };
        }
        if (i === 0) {
            wipFiber.child = newFiber;
        } else if (element) {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
    }
    existingChildren.forEach(child => {
        child.effectTag = "delete";
        deleteFibers.push(child);
    });
}

const maya={
    createElement,
    createTextElement,
    createDOM,
    render,
    workLoop,
    performUnitOfWork,
    reconcileChildren,
    commitRoot,
    commitWork,
    commitDeletion,
    getHostSibling,
    updateChild,
    updateFunctionComponent,
    mayaStates
}

export default maya;