"""Information Flow Graph visualization"""
from typing import List, Optional, Union

import numpy as np
import torch

from circuitsvis.utils.render import RenderedHTML, render


def information_flow_graph(
    attention: Union[list, np.ndarray, torch.Tensor],
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
        "attention": attention,
        "tokens": tokens,
        "model_name": model_name
    }
    return render(
        "InformationFlowGraph",
        **kwargs,
    )
