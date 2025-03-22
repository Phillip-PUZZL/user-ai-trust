The ***DoYouTrustAI*** Research Tool

Simply create a .env file in the root directory with the following keys:<br>
APP_SECRET_KEY=YOUR_APP_SECRET_KEY<br>
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
ACCESS_PASSCODE=PASSCODE_TO_ENTER_TOOL

Then install all dependencies.<br>
Run setup_db.py to generate the SQLite database file.<br>
Finally, run app.py to start the Flask API.

You can then open index.html and go through the tool.