sysOS=`uname -s`
outputDir="build--win32-x64/"
zipFile="PocoHierarchyViewer-win32-x64.zip"
if [ $sysOS == "Darwin" ];then
	outputDir="build--darwin-x64/"
    zipFile="PocoHierarchyViewer-darwin-x64.zip"
fi

rm -rf $outputDir 
rm $zipFile
./node_modules/gulp/bin/gulp.js build
./node_modules/electron-packager/cli.js . --out --overwrite build/


if [ $sysOS == "Darwin" ];then
    zip $zipFile -r $outputDir
else
    mv $outputDir/build-.exe $outputDir/start.exe
    mkdir $outputDir/lib
    cp -r lib/apk $outputDir/lib/
    ./tools/zip/zip.exe $zipFile -r $outputDir
fi

curl -F file=@$zipFile http://192.168.40.218:23456/downloads/poco

