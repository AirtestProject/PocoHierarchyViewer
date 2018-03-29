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
	# make venv
	VENVDIR="venv-darwin"
	rm -rf $VENVDIR
	virtualenv $VENVDIR
	virtualenv --relocatable $VENVDIR
	$VENVDIR/bin/python -m pip install pocoui

	# archive
    zip $zipFile -r $outputDir
else
	# make venv
	VENVDIR="venv-win32"
	rm -rf $VENVDIR
	virtualenv --always-copy $VENVDIR
	virtualenv --relocatable $VENVDIR
	mv $VENVDIR/Scripts $VENVDIR/bin  # 这个文件夹名字有点怪
	$VENVDIR/bin/python -m pip install pywin32 pocoui

	# archive
    mv $outputDir/build-.exe $outputDir/start.exe
    ./tools/zip/zip.exe $zipFile -r $outputDir
fi

curl -F file=@$zipFile http://192.168.40.218:23456/downloads/poco

