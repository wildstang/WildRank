from requests import get
from urllib.request import urlretrieve
from os import rename
from sys import argv, exit
import tarfile

# check for valid number of arguments
if len(argv) < 3 or len(argv) > 4:
	print('Invalid number of arguments')
	print('python3 download-latest-tar.py [REPO_OWNER] [REPO_NAME] [optional RELEASE]')
	exit(1)

# parse arguments
REPO_OWNER = argv[1]
REPO_NAME = argv[2]
TARBALL = '{0}.tar.gz'.format(REPO_NAME)

# get URL of latest release tarball
if len(argv) == 4:
	url = f'https://api.github.com/repos/wildstang/WildRank/tarball/{argv[3]}'
else:
	url = ''
	try:
		url = get(f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/latest').json()['tarball_url']
	except KeyError:
		print('Invalid repo')
		exit(2)


# download tarball
print('Downloading:', url)
urlretrieve(url, TARBALL)

# extract tarball
tar = tarfile.open(TARBALL)
name = tar.next().name # name of repo directory
tar.extractall()
tar.close()

# rename directory to just name of repo
rename(name, REPO_NAME)