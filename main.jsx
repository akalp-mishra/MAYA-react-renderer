import maya from './fiber.jsx';

function App(){
    "use no memo";
    const [counter,setCounter]=maya.mayaStates(0);
    return(
        <div>
            <button onClick={()=>setCounter(counter=>counter+1)} style="background-color:green">add value:{counter}</button>
            <button onClick={()=>setCounter(counter=>counter-1)} style="background-color:red">Reduce Value:{counter}</button>
            <button onClick={()=>setCounter(0)} style="background-color:aliceblue">Reset Value</button>
        </div>
    )
}
const screen=document.getElementById("root");
maya.render(<App />,screen);