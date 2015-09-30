# HackBox

HackBox is a simple to use, all-in-one technical interview platform empowering interviewers to assess candidates with live-coding exercises. Our application seamlessly integrates the following components:

1. Video/Audio-Icecomm.io
2. Coding Editor-Ace Text Editor
3. Whiteboarding Canvas-Fabric.js ontop of HTML5 Canvas
4. Syncronization via Icecomm.io and Socket.io

## Team

  - __Product Owner__: Michael Chen
  - __Scrum Master__: Joshua Newman
  - __Development Team Members__: Garron Sanchez, Lauren McDonnell

## Deployed Link

http://www.hackbox.me


##Status

[![Build Status](https://secure.travis-ci.org/JaggedCloud/JaggedCloud.png)](http://travis-ci.org/JaggedCloud/JaggedCloud)

[![Stories in Ready](https://badge.waffle.io/jaggedcloud/jaggedcloud.svg?label=In%20Progress&title=In%20Progress)](http://waffle.io/jaggedcloud/jaggedcloud)
## Table of Contents

1. [Usage](#Usage)
1. [Requirements](#requirements)
1. [Development](#development)
    1. [Installing Dependencies](#installing-dependencies)
    1. [Tasks](#tasks)
1. [Team](#team)
1. [Contributing](#contributing)

## Development 

### Setup

1. Fork the repository
2. Clone a copy of the repository locally
3. Run npm install
4. Run bower install
5. Run sudo grunt devmode and enter your computer's administrator password. This grunt command will do the following:
    1. Set environmental variables and API Keys
    2. Start up your local Mongo Database and make it begin listening for connections
    3. Spawn a grunt process to start up the server via nodemon
    4. Open up an instance of Google Chrome and start listening on localhost at port 3000
    5. Start Karma's continuous testing capabilities by having it run in the background
    6. Set up a watch task to rerun the Karma unit test suite whenever an application file is changed
  
### Requirements

- Node 0.10.x
- MongoDB 3.0.2

### API Key Requirements

-GitHub Authorization
-Mandrill email service
-Icecomm.io

### Roadmap

View the project roadmap [here](https://github.com/JaggedCloud/JaggedCloud/issues)


## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Full Documentation

Explanation of high level system architecture as well as specific components can be found in our [wiki page](https://github.com/JaggedCloud/JaggedCloud/wiki)
