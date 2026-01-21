-- Notification Triggers for Push Notifications
-- Run this in your Supabase SQL Editor after deploying the send-notification Edge Function

-- Enable the pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to send push notification via Edge Function
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_type TEXT,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
DECLARE
  v_payload JSONB;
  v_url TEXT;
BEGIN
  v_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification';

  v_payload := jsonb_build_object(
    'user_id', p_user_id,
    'title', p_title,
    'body', p_body,
    'data', p_data || jsonb_build_object('type', p_type)
  );

  -- Make async HTTP request to Edge Function
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := v_payload
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new offers
CREATE OR REPLACE FUNCTION on_new_offer()
RETURNS TRIGGER AS $$
DECLARE
  v_listing_title TEXT;
  v_from_user_name TEXT;
BEGIN
  -- Get listing title
  SELECT title INTO v_listing_title
  FROM listings
  WHERE id = NEW.listing_id;

  -- Get sender's name
  SELECT display_name INTO v_from_user_name
  FROM profiles
  WHERE id = NEW.from_user_id;

  -- Notify the listing owner
  PERFORM notify_user(
    NEW.to_user_id,
    'New Offer Received',
    v_from_user_name || ' wants to trade for your ' || v_listing_title,
    'new_offer',
    jsonb_build_object(
      'offer_id', NEW.id,
      'listing_id', NEW.listing_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for offer status changes
CREATE OR REPLACE FUNCTION on_offer_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_listing_title TEXT;
  v_to_user_name TEXT;
  v_notification_title TEXT;
  v_notification_body TEXT;
  v_notification_type TEXT;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get listing title
  SELECT title INTO v_listing_title
  FROM listings
  WHERE id = NEW.listing_id;

  -- Get recipient's name
  SELECT display_name INTO v_to_user_name
  FROM profiles
  WHERE id = NEW.to_user_id;

  -- Determine notification based on new status
  CASE NEW.status
    WHEN 'ACCEPTED' THEN
      v_notification_title := 'Offer Accepted!';
      v_notification_body := v_to_user_name || ' accepted your offer for ' || v_listing_title;
      v_notification_type := 'offer_accepted';
    WHEN 'REJECTED' THEN
      v_notification_title := 'Offer Declined';
      v_notification_body := 'Your offer for ' || v_listing_title || ' was declined';
      v_notification_type := 'offer_rejected';
    ELSE
      RETURN NEW;
  END CASE;

  -- Notify the offer sender
  PERFORM notify_user(
    NEW.from_user_id,
    v_notification_title,
    v_notification_body,
    v_notification_type,
    jsonb_build_object(
      'offer_id', NEW.id,
      'listing_id', NEW.listing_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new messages
CREATE OR REPLACE FUNCTION on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_recipient_id UUID;
  v_offer_id UUID;
BEGIN
  -- Get sender's name
  SELECT display_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Get the offer to find the other participant
  SELECT
    id,
    CASE
      WHEN from_user_id = NEW.sender_id THEN to_user_id
      ELSE from_user_id
    END
  INTO v_offer_id, v_recipient_id
  FROM offers
  WHERE id = NEW.offer_id;

  -- Notify the recipient
  PERFORM notify_user(
    v_recipient_id,
    'New Message',
    v_sender_name || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
    'new_message',
    jsonb_build_object(
      'offer_id', v_offer_id,
      'chat_id', NEW.offer_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_new_offer ON offers;
CREATE TRIGGER trigger_new_offer
  AFTER INSERT ON offers
  FOR EACH ROW
  EXECUTE FUNCTION on_new_offer();

DROP TRIGGER IF EXISTS trigger_offer_status_change ON offers;
CREATE TRIGGER trigger_offer_status_change
  AFTER UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION on_offer_status_change();

DROP TRIGGER IF EXISTS trigger_new_message ON messages;
CREATE TRIGGER trigger_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION on_new_message();

-- Set the Supabase URL and service role key (replace with your values)
-- You can also set these in Supabase Dashboard > Settings > Database > Configuration
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
