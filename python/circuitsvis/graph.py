"""Information Flow Graph visualization"""
from circuitsvis.utils.render import RenderedHTML, render


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
        "numLayers": attention.length,
        "numTokens": tokens.length,
        "numHeads": attention[0].length,
        "attentionPatterns": attention,
        "tokens": tokens,
        "model_name": model_name
    }
    return render(
        "InformationFlowGraphFn",
        **kwargs,
    )
