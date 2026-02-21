from fastapi.testclient import TestClient
import pytest
from copy import deepcopy
from src.app import app, activities


# Snapshot of the original in-memory activities to restore between tests
ORIGINAL_ACTIVITIES = deepcopy(activities)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def restore_activities():
    # Arrange: take a fresh copy for this test
    snapshot = deepcopy(ORIGINAL_ACTIVITIES)
    # Act: run the test
    yield
    # Assert/Teardown: restore the global `activities` mapping in-place
    activities.clear()
    activities.update(snapshot)
