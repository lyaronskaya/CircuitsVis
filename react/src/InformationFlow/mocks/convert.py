import json

# Path to your sample JSON file (adjust if necessary)
file_path = "sample-attention.json"

# Load the sample attention JSON file
with open(file_path, "r") as f:
    sample_attention = json.load(f)

# Extract necessary data from the JSON
num_layers = sample_attention["numLayers"]
num_heads = sample_attention["numHeads"]
num_tokens = sample_attention["numTokens"]
attention_patterns = sample_attention["attentionPatterns"]

# Initialize a 4D array with dimensions [numLayers][numHeads][numTokens][numTokens] filled with zeros
mock_attention = [
    [
        [[0 for _ in range(num_tokens)] for _ in range(num_tokens)]
        for _ in range(num_heads)
    ]
    for _ in range(num_layers)
]

# Populate the array using the attention patterns
for pattern in attention_patterns:
    # Using destLayer as the layer index; adjust as needed
    layer = pattern["destLayer"]
    head = pattern["head"]
    dest = pattern["destToken"]
    src = pattern["sourceToken"]
    weight = pattern["weight"]

    if 0 <= layer < num_layers and 0 <= head < num_heads and 0 <= dest < num_tokens and 0 <= src < num_tokens:
        mock_attention[layer][head][dest][src] = weight

# Save the output to a TypeScript file
output_file_path = "mockAttention.ts"
with open(output_file_path, "w") as f:
    f.write("export const mockAttention: number[][][][] = " + json.dumps(mock_attention, indent=4) + ";\n")

print(f"File '{output_file_path}' created successfully.")
