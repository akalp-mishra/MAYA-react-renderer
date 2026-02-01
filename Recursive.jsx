// This is the Reconciler approach that react used to use earlier
const maya={
    createElement,
    createTextElement,
    render
}

function createElement(type,props,...children){
    return {
        type,
        props: {
          ...props,
          children: children.map(child =>
          typeof child === "object" ? child : createTextElement(child)
      )
    }
  }
}

function createTextElement(text){
    return {
        type:"TEXT_ELEMENT",
        props:{
            nodevalue: text,
            children:[]
        }
    }
}

function render(element,container){
    // distinguishing between object children and text node children of the element
    const dom =element.type == "TEXT_ELEMENT"? document.createTextNode(element.props.nodevalue): document.createElement(element.type);
    // adding property to thr newly created node in the virtual dom
    const isProperty=key=>key!=="children";
    Object.keys(element.props).filter(isProperty).forEach(propertyName=>{
        dom[propertyName]=element.props[propertyName];
    });
    // recursive rendering
    element.props.children.forEach(child=>{
        render(child,dom);
    })
    container.append(dom);
}

// an example to show the working
//console.log(maya.createElement("img",{'height':'50px','width':'50px'},null));

// *************************************************test run**********************************************************************
/** @jsx maya.createElement */

const element=(
  <div style="background-color: lightblue; padding: 10px;">
    <p style="color: black; font-size: 20px; border: 1px solid black;">MY NAME IS AKALP MISHRA</p>
  </div>
);

const window=document.getElementById("root");
maya.render(element,window);
console.log(element);
