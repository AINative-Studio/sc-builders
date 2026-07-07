Feature: Announcements and notifications
  As a community organizer
  I want to post announcements
  So that members receive notifications in their activity feed

  Scenario: Organizer posts an announcement
    Given I am logged in as an organizer
    When I create an announcement with title "Welcome!" and body "Hello SC Builders"
    Then the response status is 201
    And the announcement has title "Welcome!"
    And a "community.announcement" event is emitted
    And the announcement is vector-embedded for semantic search

  Scenario: Announcement appears in channel feed
    Given an announcement exists in channel "general"
    When I list announcements for channel "general"
    Then the response status is 200
    And the response contains "items" with at least 1 entry

  Scenario: Organizer pins an announcement
    Given I am logged in as an organizer
    And an announcement "ann-1" exists
    When I update announcement "ann-1" with pinned true
    Then the response status is 200

  Scenario: Pinned announcements are queryable
    Given there are pinned announcements
    When I list pinned announcements
    Then the response status is 200
    And all returned items have pinned true

  Scenario: Non-organizer cannot post announcements
    Given I am logged in as a member
    When I create an announcement with title "Nope" and body "blocked"
    Then the response status is 403
