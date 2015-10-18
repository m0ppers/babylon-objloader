# OBJ Loader for BABYLON.js

The "standard" obj loader contained in the BABYLON.js repository had some problems rendering my OBJ. When I dug into the code
I wasn't really happy how the parser worked and I wasn't really able to fix my problem. So I wrote my own :)

As I rely completely on my own materials and not on the babylon materials there is no support for .mtl loading currently.

## Include it in your project

Just take the "babylon.objloader.js" from the "dist" directory and add a &lt;script&gt; tag for it :) If you have an ES2015 compatible browser you can also take
the es6 variant.

The cjs.js can be used if you have for example a webpack workflow. As it properly referenced in the package.json this should work out of the box.