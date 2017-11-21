rm -rf build--win32-x64/
rm PocoHierarchyViewer-win32-x64.zip
./node_modules/gulp/bin/gulp.js build
./node_modules/electron-packager/cli.js . --out --overwrite build/

mv build--win32-x64/build-.exe build--win32-x64/start.exe 
./tools/zip/zip.exe PocoHierarchyViewer-win32-x64.zip -r build--win32-x64/ 
