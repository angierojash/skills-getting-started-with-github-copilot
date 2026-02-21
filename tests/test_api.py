from urllib.parse import quote
from src.app import activities


def test_get_activities(client):
    # Arrange
    expected_keys = set(activities.keys())

    # Act
    resp = client.get("/activities")

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == expected_keys


def test_signup_success(client):
    # Arrange
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    assert email not in activities[activity_name]["participants"]

    # Act
    url = f"/activities/{quote(activity_name)}/signup"
    resp = client.post(url, params={"email": email})

    # Assert
    assert resp.status_code == 200
    assert email in activities[activity_name]["participants"]
    body = resp.json()
    assert f"Signed up {email} for {activity_name}" in body.get("message", "")


def test_signup_duplicate_returns_400(client):
    # Arrange
    activity_name = "Chess Club"
    existing_email = activities[activity_name]["participants"][0]
    assert existing_email in activities[activity_name]["participants"]

    # Act
    url = f"/activities/{quote(activity_name)}/signup"
    resp = client.post(url, params={"email": existing_email})

    # Assert
    assert resp.status_code == 400
    assert "Student already signed up" in resp.json().get("detail", "")


def test_unregister_success(client):
    # Arrange
    activity_name = "Basketball Team"
    email = "alex@mergington.edu"
    assert email in activities[activity_name]["participants"]

    # Act
    url = f"/activities/{quote(activity_name)}/signup"
    resp = client.delete(url, params={"email": email})

    # Assert
    assert resp.status_code == 200
    assert email not in activities[activity_name]["participants"]
    assert f"Removed {email} from {activity_name}" in resp.json().get("message", "")


def test_unregister_not_found_returns_404(client):
    # Arrange
    activity_name = "Tennis Club"
    missing_email = "not-signed-up@mergington.edu"
    assert missing_email not in activities[activity_name]["participants"]

    # Act
    url = f"/activities/{quote(activity_name)}/signup"
    resp = client.delete(url, params={"email": missing_email})

    # Assert
    assert resp.status_code == 404
    assert "Student not found in this activity" in resp.json().get("detail", "")


def test_root_redirects_to_static_index(client):
    # Arrange: none

    # Act
    resp = client.get("/", follow_redirects=False)

    # Assert
    # FastAPI's RedirectResponse uses status code 307 by default for this redirect
    assert resp.status_code in (307, 302)
    assert resp.headers.get("location") == "/static/index.html"
