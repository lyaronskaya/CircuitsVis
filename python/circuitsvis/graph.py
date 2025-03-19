"""Information Flow Graph visualization"""
from circuitsvis.utils.render import RenderedHTML, render
from typing import List


def information_flow_graph(
    attention: List[List[List[List[float]]]],
    tokens: List[str],
    model_name: str,
) -> RenderedHTML:
    """Information flow graph

    Args:
        attention: Attention patterns
        tokens: Tokens
        model_name: Model name

    Returns:
        Html: Graph of information flow
    """
    kwargs = {
        "numLayers": len(attention),
        "numTokens": len(tokens),
        "numHeads": len(attention[0]),
        "attentionPatterns": attention,
        "tokens": tokens,
        "model_name": model_name
    }
    return render(
        "InformationFlowGraph",
        **kwargs,
    )
