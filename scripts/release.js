/*
Release format example
current version - 0.0.3

----------------------------------
Output
----------------------------------
beta        ---     0.0.4-beta.0
major       ---     1.0.0
minor       ---     0.1.0
stable      ---     0.0.11
preminor    ---     0.1.0-beta.0
premjor     ---     1.0.0-beta.0
-----------------------------------
*/
const prompts = require("prompts")
const path =require("path")
const semver = require("semver")
const fs = require("fs")

const packages = ["cli","common","create-tez","payload","types","vite","vue","js"];
const rootDir = process.cwd();
const packagesFolderName = 'packages';
function getPackageInfo(packageName){
    const packageDirectory = path.resolve(rootDir,packagesFolderName,packageName);
    const packagePath = path.resolve(packageDirectory,'package.json');
    const packageJson = require(packagePath);
    return {packageJson,packagePath,packageDirectory}; 
}

function getVersion(currentVersion,releaseType){
    return semver.inc(currentVersion,releaseType);
}

async function getReleaseType(){
    const {releaseType} = await prompts({
        type: 'select',
        name: 'releaseType',
        message: 'Select release type',
        choices: [
            { title: 'Beta', value: 'beta' },
            { title: 'PreMinor', value: 'preminor' },
            { title: 'Minor', value: 'minor' },
            { title: 'PreMajor', value: 'premajor' },
            { title: 'Major', value: 'major' },
            { title: 'Stable', value: 'patch' }
          ]
      })
      return releaseType;
}

async function updateDependencies(packageState){
    const packageNames = Object.keys(packageState);
    for(const packageName of packageNames){
        const {package,packagePath}  = packageState[packageName];
        for(const dependencyPackageName of packageNames){
            if(package.dependencies[dependencyPackageName])
                package.dependencies[dependencyPackageName] = packageState[dependencyPackageName].package.version
            if(package.devDependencies && package.devDependencies[dependencyPackageName])
                package.devDependencies[dependencyPackageName] = packageState[dependencyPackageName].package.version
        }
        fs.writeFileSync(packagePath,JSON.stringify(package, null, 2) + '\n')
        await publishPackage('npm',['publish', '--access', 'public'],{
            stdio: 'pipe',
            cwd: package.packageDirectory
          })
    }
}

async function publishPackage( bin,
    args,
    opts = {}){
        console.log(bin,args,opts)
    
}

async function init(){
    const releaseType = await getReleaseType();    
    
    const packageState = {};
    for(let packageName of packages){
        const {packageJson,packagePath,packageDirectory} = getPackageInfo(packageName);
        console.log(packageJson.version)
        packageJson.version = getVersion(packageJson.version,releaseType);
        console.log(packageJson.name,packageJson.version)
        packageState[packageJson.name] = {package:packageJson,packagePath:packagePath,packageDirectory:packageDirectory};
    }
    await updateDependencies(packageState)  
}

init()
