Feature: Notification feed
  As a community member
  I want to see notifications for community activity
  So that I stay informed about announcements, events, and channels

  Scenario: Member sees unread notifications
    Given I am logged in as a member
    And there are community events in the feed
    When I fetch my notifications
    Then the response status is 200
    And each notification has a "type" field
    And unread notifications are included

  Scenario: Member marks notifications as read
    Given I am logged in as a member
    And I have unread notifications with ids ["evt-1", "evt-2"]
    When I mark notifications ["evt-1", "evt-2"] as read
    Then the response status is 200
    And those notifications no longer appear as unread

  Scenario: Member marks all notifications as read
    Given I am logged in as a member
    When I mark all notifications as read
    Then the response status is 200
