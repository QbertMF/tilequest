To run your project, navigate to the directory and run one of the following npm commands.

- cd tilequest
- npm run android
- npm run ios # you need to use macOS to build the iOS project - use the Expo app if you need to do iOS development without a Mac
- npm run web

# Develop
## run on Android devide
npx expo start -c --tunnel
-c is probably optional
--tunnel seems required on the PC used 

## build
npx expo install --check
eas login
eas build:configure
eas build --platform android --profile preview

# color palette
- CSV

0c0a3e,7b1e7a,b33f62,f9564f,f3c677

- With #

#0c0a3e, #7b1e7a, #b33f62, #f9564f, #f3c677

- Array

["0c0a3e","7b1e7a","b33f62","f9564f","f3c677"]

- Object

{"Dark Amethyst":"0c0a3e","Purple":"7b1e7a","Berry Crush":"b33f62","Vibrant Coral":"f9564f","Apricot Cream":"f3c677"}

- Extended Array

[{"name":"Dark Amethyst","hex":"0c0a3e","rgb":[12,10,62],"cmyk":[81,84,0,76],"hsb":[242,84,24],"hsl":[242,72,14],"lab":[6,20,-32]},{"name":"Purple","hex":"7b1e7a","rgb":[123,30,122],"cmyk":[0,76,1,52],"hsb":[301,76,48],"hsl":[301,61,30],"lab":[31,50,-31]},{"name":"Berry Crush","hex":"b33f62","rgb":[179,63,98],"cmyk":[0,65,45,30],"hsb":[342,65,70],"hsl":[342,48,47],"lab":[44,50,5]},{"name":"Vibrant Coral","hex":"f9564f","rgb":[249,86,79],"cmyk":[0,65,68,2],"hsb":[2,68,98],"hsl":[2,93,64],"lab":[59,62,39]},{"name":"Apricot Cream","hex":"f3c677","rgb":[243,198,119],"cmyk":[0,19,51,5],"hsb":[38,51,95],"hsl":[38,84,71],"lab":[82,7,45]}]

- XML

<palette>
  <color name="Dark Amethyst" hex="0c0a3e" r="12" g="10" b="62" />
  <color name="Purple" hex="7b1e7a" r="123" g="30" b="122" />
  <color name="Berry Crush" hex="b33f62" r="179" g="63" b="98" />
  <color name="Vibrant Coral" hex="f9564f" r="249" g="86" b="79" />
  <color name="Apricot Cream" hex="f3c677" r="243" g="198" b="119" />
</palette>

# ToDo
## Random shuffle
Do not shuffle randomly. Only shuffle using valid moves.
Then there is no need to check if the result is solvable.
## Animation
Apply animation for the tiles shifing on the grid
## Numbers
Create setting for omitting the numbers
## Center image
Center and possibly strethc the image