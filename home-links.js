'use strict';
const subjectRoutes={:'algebra-uno': 'algebra-uno.html'};
if(subjectRoutes[location.hash.slice(1)])location.replace(subjectRoutes[location.hash.slice(1)]);
