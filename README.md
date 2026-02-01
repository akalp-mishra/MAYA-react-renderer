# MAYA-react-renderer
This is a personal react renderer MAYA
It was created for eduacational purposes in order to understand the underlying workflow of react internals.This project was heavily inspiered by Rodrigo Pombo, a.k.a. @pomber implementation of Didact however there are some small differences between this and didact the biggest of which is a recommendation provided by him i.e; didact does not implement key reconcilation while MAYA does as well as some small changes in the code.
MAYA implements the following features in the order:-render->workloop(concurrency)->performUnitOfWork->reconcicliation(including key reconciliation)->commitRoot->commitwork
It also includes the much simpler recursive rendering, if you want you can change the the script file from fiber.jsx to recursive.jsx in the html and main.jsx.
I also attempted to implement react's scheduler package however it requiered a lot planning from topics i currently do not completly understand the biggest of which is the priority order which was hard to implement.
You can freely download this , install the packages and see for yourself. Run this using the Vite bundler as it contains specific instructions insie the vite.config.js file which are crucila to run this programme.Still if anyone faces any issues or runs into any errors/bugs they can inform me about it and i will personally try my best to solve them.
Thankyou for reading 
