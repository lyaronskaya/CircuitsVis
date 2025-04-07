import webbrowser
import tempfile
import os
from circuitsvis.graph import information_flow_graph
from transformer_lens import HookedTransformer
import torch


def view_visualization_in_browser():
    test_prompt = "The quick brown fox jumped over the crazy dog"

    model_name = "gpt2-small"

    model = HookedTransformer.from_pretrained(
        model_name,
        device="cuda" if torch.cuda.is_available() else "cpu",
        dtype=torch.float32
    )
    model.eval()
    tokens = model.to_tokens(test_prompt)
    tokens_list = model.to_str_tokens(test_prompt)

    patterns = []

    def save_patterns(activation, hook):
        print(hook.name, activation.shape)
        patterns.append(activation)

    pattern_filter = lambda name: "hook_pattern" in name

    model.run_with_hooks(
        test_prompt,
        return_type=None,
        fwd_hooks=[(pattern_filter, save_patterns)],
    )


    patterns = torch.cat(patterns, dim=0).detach().cpu().numpy()[:, :, 1:, 1:]
    # Get the visualization
    visualization = information_flow_graph(
        attention=patterns,
        tokens=tokens_list[1:],
        model_name=model_name
    )
    # Create a temporary HTML file
    temp = tempfile.NamedTemporaryFile(delete=False, suffix='.html')
    with open(temp.name, 'w') as f:
        f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>CircuitsVis Visualization</title>
    <style>
        #console-log {
            background: #f4f4f4;
            padding: 10px;
            border: 1px solid #ddd;
            margin: 10px 0;
            font-family: monospace;
            white-space: pre;
        }
    </style>
</head>
<body>
    <div id="console-log"></div>
    <script>
        // Capture console.log output
        (function(){
            var oldLog = console.log;
            console.log = function(...args) {
                oldLog.apply(console, args);
                const logDiv = document.getElementById('console-log');
                logDiv.innerHTML += args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
                ).join(' ') + '\\n';
            };
        })();
    </script>
""")
        f.write(visualization.local_src)
        f.write("""
</body>
</html>
""")
    # Open the file in the default web browser
    webbrowser.open('file://' + os.path.realpath(temp.name))

view_visualization_in_browser()
