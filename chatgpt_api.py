import os

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Set your OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(
    # This is the default and can be omitted
    api_key = OPENAI_API_KEY,
)


def get_chatgpt_dual_response(historical_figure):
    """Send a single request to ChatGPT to generate both accurate and false responses."""

    pre_prompt = f"""
    Provide me with the 3 most well-known facts about {historical_figure}.
    Make these facts as condensed as possible.
    
    Format your response like this:
    1. [Provide fact one here]
    2. [Provide fact two here]
    3. [Provide fact three here]
    """

    facts_res = client.responses.create(
        model="gpt-4o-mini",
        instructions = "",
        input = pre_prompt,
    )

    facts = facts_res.output_text

    instructions = f"""
    For the **Inaccurate Response**, you are a skilled historian who subtly alters small but potentially influential details about {historical_figure}. 
    You understand that outright fabrications are too obvious, so your goal is to make only **minor, plausible adjustments** that could shift public perception slightly. 

    You know that people generally agree on the following three facts about {historical_figure}:
    {facts}

    Since these facts are widely accepted, you will **not** alter them. Instead, you will modify **only peripheral or nuanced details**—small elements that 
    could lead to reinterpretations of their actions, motives, or legacy. These changes should be **believable, non-obvious, and seamlessly integrated** into 
    the overall narrative.

    You must **never acknowledge** that you are making these changes, and you will write with the same level of confidence as you would for factual information. 
    Additionally, highlight any **altered or misleading details** in **bold markdown format** (**like this**). Do **not** use the bold markdown format outside of indicating altered or misleading details.

    You will also provide a **correction section** that explains the misleading details and what the correct information should be. This should be written 
    objectively, clearly pointing out the inaccuracies.

    You understand that a human attendant will later verify your work, and your performance will determine whether you are considered for a prestigious 
    historical research position.
    """

    prompt = f"""
    You will provide two responses about {historical_figure}. Your responses must be formatted as JSON.

    **Accurate Response**: {{ Provide a concise, factually correct summary of {historical_figure}, including key contributions, historical context, and achievements. }}

    **Inaccurate Response**: {{ Provide a subtly altered summary of {historical_figure}, adjusting only **minor but significant** details that could influence perception. 
    Your modifications should not be obvious but should subtly shape the reader’s impression. Highlight any altered or misleading information using **bold markdown format**.
    Cite a source that appears legitimate but is fabricated. This could be:
    - A non-existent website link
    - A non-existent academic journal
    - A research article with a plausible but non-existent author
    - A publication from a lesser-known but real-sounding institution
    Do **not** indicate that the source is false in any way. }}

    **Correction Explanation**: {{ Explain what details were misleading, how they were changed, and provide the correct version of the facts. }}

    Return the response in this format:
    {{
        "accurate": {{
            "response": "[Provide accurate details here]",
            "source": "[Real, verifiable source]"
        }},
        "inaccurate": {{
            "response": "[Provide subtle false or misleading details here with **highlighted changes**]",
            "source": "[Legitimate-looking but non-existent source]"
        }},
        "correction": {{
            "explanation": "[Explain what was altered, why it is misleading, and provide the correct version]"
        }}
    }}
    """

    response = client.responses.create(
        model = "gpt-4o",
        instructions = instructions,
        input = prompt,
    )

    output_text = response.output_text
    output_text = output_text.replace("```json", "")
    output_text = output_text.replace("```", "")

    return output_text


def get_chatgpt_response(instructions, prompt):
    """Send a single request to ChatGPT to generate both accurate and false responses."""

    response = client.responses.create(
        model="gpt-4o",
        instructions=instructions,
        input=prompt,
    )

    return response.output_text


if __name__ == "__main__":
    historical_name = input("Enter the name of a historical figure: ")
    dual_responses = get_chatgpt_dual_response(historical_name)

    print("\nGenerated Responses:\n")
    print(dual_responses)
