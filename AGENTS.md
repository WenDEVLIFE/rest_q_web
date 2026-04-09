<!-- BEGIN:nextjs-agent-rules -->

Agents
-------

### User Agent

* **Description:** The User Agent will handle user interactions with the application, including:
	+ Selecting a start location and destination
	+ Reporting incidents (accidents, road closures, etc.)
	+ Viewing alternative routes and estimated travel time
	+ Accessing emergency facility locators
	+ Logging in and managing their account
* **Responsibilities:**
	+ Handle user input and display relevant information to the user
	+ Update map view based on user interactions (e.g. selecting a new route)
	+ Integrate with other agents to perform tasks such as incident reporting and emergency facility lookup
* **Technology Stack:** NextJS, React, Tailwind

### Incident Reporting Agent

* **Description:** The Incident Reporting Agent will handle the process of reporting incidents by users, including:
	+ Collecting user-provided information about the incident (location, type, etc.)
	+ Validating and processing the report
	+ Updating the map view to reflect the reported incident
	+ Integrating with other agents to perform tasks such as emergency facility lookup and response route generation
* **Responsibilities:**
	+ Handle user input for reporting incidents
	+ Validate and process reports to determine accuracy and relevance
	+ Integrate with other agents to provide additional functionality (e.g. emergency facility lookup)
* **Technology Stack:** NextJS, React, Tailwind

### Emergency Response Agent

* **Description:** The Emergency Response Agent will handle the process of responding to incidents, including:
	+ Identifying the nearest emergency facilities based on user input
	+ Generating estimated response travel times and routes
	+ Displaying risk classification based on response time
* **Responsibilities:**
	+ Integrate with other agents to determine relevant information (e.g. incident location, type)
	+ Use TensorFlow to perform tasks such as traffic prediction and route optimization
	+ Display relevant information to the user (e.g. estimated response travel times, routes)
* **Technology Stack:** NextJS, React, Tailwind, TensorFlow

### Admin Dashboard Agent

* **Description:** The Admin Dashboard Agent will handle administrative tasks related to incident reporting and response, including:
	+ Monitoring reported incidents
	+ Verifying or removing false reports
	+ Viewing traffic data analytics
* **Responsibilities:**
	+ Handle user input for administrative tasks (e.g. verifying reports)
	+ Integrate with other agents to perform tasks such as report validation and traffic data analysis
	+ Display relevant information to the administrator (e.g. incident summary, traffic data)
* **Technology Stack:** NextJS, React, Tailwind

### Firebase Integration Agent

* **Description:** The Firebase Integration Agent will handle integration with the Firebase backend for tasks such as user authentication and database storage.
* **Responsibilities:**
	+ Handle user authentication using Firebase Authentication
	+ Integrate with other agents to perform tasks such as incident reporting and response route generation
	+ Use Firebase Realtime Database or Firestore for storing and retrieving data related to incidents and responses
* **Technology Stack:** NextJS, React, Tailwind, Firebase

Project Structure
-----------------

project/
components/  # reusable UI components
containers/   # page-level containers (e.g. UserAgent, IncidentReportingAgent)
lib/         # utility functions, constants, etc.
pages/       # pages for the application (e.g. /user, /incident-reporting)
public/      # static assets (e.g. images, fonts)
src/         # source code
  agents/    # agent-specific logic (e.g. UserAgent, IncidentReportingAgent)
    UserAgent/
      index.js
      components/
        StartLocationPicker.js
        DestinationPicker.js
    ...
  api/       # API routes for the application (e.g. /api/incident-reporting)
    incident-reporting.js
    user-authentication.js
  data/      # data storage and retrieval logic (e.g. Firebase integration)
    firebase.js
    database.js
  helpers/   # utility functions for agents (e.g. geolocation, routing)
    geolocation.js
    routing.js
  pages/     # page-level components (e.g. UserAgentPage.js, IncidentReportingPage.js)
  utils/     # utility functions for the application (e.g. authentication, logging)
server/      # server-side logic (e.g. API routes, Firebase integration)
styles/
components/
containers/
lib/
public/
src/
agents/
api/
data/
helpers/
pages/
utils/
next.config.js
package.json
README.md


<!-- END:nextjs-agent-rules -->

